import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const originalContent = `[vc_row content_width="grid" css=".vc_custom_1736183355801{margin-top: 50px !important;padding-top: 64px !important;}" el_class="gap-top-rm"][vc_column][vc_row_inner content_width="grid" content_aligment="center" css=".vc_custom_1735735342415{background-color: #F7F7F7 !important;border-color: #B7B7B7 !important;}" el_class="call-action-la-content-row2 electronic-dj-video-row"][vc_column_inner width="2/3"][mkd_separator position="center" color="#F7F7F700" thickness="50"][mkd_section_title title_text="Electronic Music DJ Class" text_align="center" text_size="38"][vc_empty_space height="10px"][mkd_section_title title_text="-" highlighted_text="Miami" text_align="center" text_color="#F7F7F7" text_size="28"][vc_column_text css=""]<strong>Curso de DJ Pro en Español – </strong>click <a href="https://mia.garnishmusicproduction.com/courses/curso-de-dj-espanol/" target="_blank" rel="noopener">here</a>/haga clic <a href="https://mia.garnishmusicproduction.com/courses/curso-de-dj-espanol/" target="_blank" rel="noopener">aquí</a>

Our split-level Electronic Music DJ course includes your very own slot at our club night.

“I needed to brush up on some production software, so I called Garnish, as they have the best instructors” – <a href="https://jamiejones.com/" target="_blank" rel="noopener">Jamie Jones</a>

Perfect for both beginners and those who’ve dabbled at home, eager to master real-world techniques on the latest professional equipment.  Taught by our superior roster of professional electronic music touring DJs, the course offers a truly personal experience, with a class size limited to just <strong>four students</strong>.

Successful students will be invited to join our <a href="https://bcn.garnishmusicproduction.com/music/ibiza-dj-bootcamp/" target="_blank" rel="noopener">Ibiza Bootcamp</a>, for specialist training in Barcelona, and a performance in Ibiza!

<strong>We do not offer our DJ classes online, anywhere. </strong>Our DJ class involves hands-on learning and interaction with equipment, which is impossible to replicate in an online environment. Online DJ classes do not provide the same level of personal attention and feedback that is achieved in our in-person class, which greatly impacts the quality of the learning experience. Learning how to DJ should be FUN – not frustrating!

Please note that our club night is not always scheduled straight after your course, so if you’re coming to Miami from out of town, please bear this in mind. If you can’t make our club night but wish to be in the lineup on a future date, we can make that happen.[/vc_column_text][mkd_separator position="center" color="#F7F7F7" thickness="50"][/vc_column_inner][vc_column_inner width="1/3"][vc_video link="https://youtube.com/shorts/k0114kRyvpo?si=xwNmCmU9z3Ia6Di9" el_aspect="916" css=""][/vc_column_inner][/vc_row_inner][/vc_column][/vc_row][vc_row content_width="grid" el_class="blured-images-wrapper"][vc_column][vc_row_inner css=".vc_custom_1759301336743{margin-top: 50px !important;margin-right: 0px !important;margin-bottom: 50px !important;margin-left: 0px !important;background: #B7B7B7 url(/api/media/file/IMG_6909-scaled-4.jpg) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;border-radius: 20px !important;border-color: #000000 !important;}"][vc_column_inner width="1/2" css=".vc_custom_1759301524640{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1759301592106{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Let’s Go</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Equipment, set up, and ready to go
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Mixer essentials
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Beats and bars
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Intro to beat matching
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] The structure of electronic music[/vc_column_text][/vc_column_inner][vc_column_inner width="1/2" css=".vc_custom_1735730075831{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435692621{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Arrangement of Electronic Music</h4>
<p style="text-align: left;">[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Pitch and identifying dissonance (known as clashing)
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Where to mix in and mix out
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Differences you need to know between Trap/Bass and ‘Four-On-The-Floor’[/vc_column_text][/vc_column_inner][/vc_row_inner][vc_row_inner css=".vc_custom_1759301136535{margin-top: 50px !important;margin-right: 0px !important;margin-bottom: 50px !important;margin-left: 0px !important;background: #B7B7B7 url(/api/media/file/IMG_1045-2-scaled-1.jpg) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;border-radius: 20px !important;border-color: #000000 !important;}"][vc_column_inner width="1/2" css=".vc_custom_1735730060477{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435736664{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Building a Set</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Tips on track choice
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Tempo
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Set order
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Mix points
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Teaser mixes[/vc_column_text][/vc_column_inner][vc_column_inner width="1/2" css=".vc_custom_1735730075831{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435758903{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>FX</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Introduction to common FX
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] EQ
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] All about filtering
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] FX in the mix dos and don’ts[/vc_column_text][/vc_column_inner][/vc_row_inner][vc_row_inner css=".vc_custom_1759301157456{margin-top: 50px !important;margin-right: 0px !important;margin-bottom: 50px !important;margin-left: 0px !important;background: #B7B7B7 url(/api/media/file/IMG_2892-scaled-1.jpg) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;border-radius: 20px !important;border-color: #000000 !important;}"][vc_column_inner width="1/2" css=".vc_custom_1735730060477{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435796223{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Hardware &amp; Software</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Pioneer Nexus
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Rekordbox
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] <a href="https://www.mixedinkey.com/" target="_blank" rel="noopener noreferrer">Mixed In Key</a>[/vc_column_text][/vc_column_inner][vc_column_inner width="1/2" css=".vc_custom_1735730075831{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435818863{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Your Set</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Fine tuning your set
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Mixing acapellas
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Reading a crowd and having a ‘plan b’[/vc_column_text][/vc_column_inner][/vc_row_inner][vc_row_inner css=".vc_custom_1759301179903{margin-top: 50px !important;margin-right: 0px !important;margin-bottom: 50px !important;margin-left: 0px !important;background: #B7B7B7 url(/api/media/file/IMG_7473-1-scaled-13.jpg) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;border-radius: 20px !important;border-color: #000000 !important;}"][vc_column_inner width="1/2" css=".vc_custom_1735730060477{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435859187{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Advanced Mixing &amp; Digital Tricks</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Sampling and triggering
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] All about delay and reverb in the mix
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Looping and making your own mash-ups on the fly
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Impact mixing with levels and FX
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Body language behind the decks[/vc_column_text][/vc_column_inner][vc_column_inner width="1/2" css=".vc_custom_1735730075831{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435940620{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Advanced Set Building &amp; Ad-libbing</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Out-of-the-box song choice
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Tempo change tips
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Music programming[/vc_column_text][/vc_column_inner][/vc_row_inner][vc_row_inner css=".vc_custom_1759301198583{margin-top: 50px !important;margin-right: 0px !important;margin-bottom: 50px !important;margin-left: 0px !important;background: #B7B7B7 url(/api/media/file/fotor_2023-6-7_16_50_38-scaled-1.webp) !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;border-radius: 20px !important;border-color: #000000 !important;}"][vc_column_inner width="1/2" css=".vc_custom_1735730060477{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435968572{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>Preparing for Your Show</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Recording your set for submission
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Marketing and promoting your gig[/vc_column_text][/vc_column_inner][vc_column_inner width="1/2" css=".vc_custom_1735730075831{padding-top: 35px !important;padding-right: 35px !important;padding-bottom: 35px !important;padding-left: 35px !important;border-radius: 20px !important;border-color: #B7B7B7 !important;}"][vc_column_text css=".vc_custom_1736435998138{background-color: #F7F7F7E3 !important;border-radius: 20px !important;border-color: #B7B7B736 !important;}" el_class="paragraph-spacing"]
<h4>After Your Show</h4>
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] How to keep the momentum going and get more gigs
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] EPK tips
[mkd_icon icon_pack="font_awesome" fa_icon="fa-solid fa-arrow-right" size="mkd-icon-tiny" custom_size="" type="normal" border_radius="" shape_size="" icon_color="#ce1713" border_color="" border_width="" background_color="" hover_icon_color="" hover_border_color="" hover_background_color="" margin="" icon_animation="" icon_animation_delay="" link="" anchor_icon="" target="_self"] Developing your sound[/vc_column_text][/vc_column_inner][/vc_row_inner][/vc_column][/vc_row][vc_row content_width="grid" css=".vc_custom_1735819130193{margin-top: 50px !important;}"][vc_column][vc_row_inner content_width="grid" content_aligment="center" css=".vc_custom_1735735342415{background-color: #F7F7F7 !important;border-color: #B7B7B7 !important;}" el_class="call-action-la-content-row2"][vc_column_inner][mkd_separator position="center" color="#F7F7F700" thickness="50"][vc_empty_space height="20"][vc_column_text css=""]
<p style="text-align: center;">To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don't send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>
[/vc_column_text][vc_empty_space height="20"][vc_column_text css=""]
<div class="vc_empty_space"></div>
<div class="wpb_text_column wpb_content_element">
<div class="wpb_wrapper">
<p style="text-align: center;"><a href="https://mia.garnishmusicproduction.com/product/electronic-music-dj-course/" target="_blank" rel="noopener noreferrer"><picture class="aligncenter wp-image-10439 size-medium" data-od-replaced-sizes="(max-width: 300px) 100vw, 300px" data-od-xpath="/HTML/BODY/DIV[@class='mkd-wrapper']/*[1][self::DIV]/*[4][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::P]/*[1][self::A]/*[1][self::IMG]"><source srcset="/api/media/file/See-Schedule-300x114.gif.webp 300w, /api/media/file/See-Schedule-170x65.gif.webp 170w" type="image/webp" sizes="(782px &lt; width) 1300px, (max-width: 300px) 100vw, 300px" data-lazy-srcset="/api/media/file/See-Schedule-300x114.gif.webp 300w, /api/media/file/See-Schedule-170x65.gif.webp 170w" /><img class="entered lazyloaded" src="/api/media/file/See-Schedule-300x114-1.gif" sizes="(782px &lt; width) 1300px, (max-width: 300px) 100vw, 300px" srcset="/api/media/file/See-Schedule-300x114-1.gif 300w, /api/media/file/See-Schedule-170x65.gif 170w" alt="" width="300" height="114" data-od-replaced-sizes="(max-width: 300px) 100vw, 300px" data-od-xpath="/HTML/BODY/DIV[@class='mkd-wrapper']/*[1][self::DIV]/*[4][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[2][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[1][self::DIV]/*[3][self::DIV]/*[1][self::DIV]/*[1][self::P]/*[1][self::A]/*[1][self::IMG]" data-lazy-srcset="/api/media/file/See-Schedule-300x114-1.gif 300w, /api/media/file/See-Schedule-170x65.gif 170w" data-lazy-sizes="(782px &lt; width) 1300px, (max-width: 300px) 100vw, 300px" data-lazy-src="/api/media/file/See-Schedule-300x114-1.gif" data-ll-status="loaded" /></picture></a></p>

</div>
</div>
[/vc_column_text][mkd_separator position="center" color="#F7F7F7" thickness="50"][/vc_column_inner][/vc_row_inner][/vc_column][/vc_row][vc_row content_width="grid"][vc_column offset="vc_hidden-lg vc_hidden-md vc_hidden-sm vc_hidden-xs"][vc_row_inner][vc_column_inner][vc_column_text css=""]
<h2 style="font-size: 36px !important;"><strong>Electronic Music DJ Class | Miami</strong></h2>
&nbsp;

<strong>Curso de DJ Pro en Español - </strong>click <a href="https://mia.garnishmusicproduction.com/courses/curso-de-dj-espanol/" target="_blank" rel="noopener">here</a>/haga clic <a href="https://mia.garnishmusicproduction.com/courses/curso-de-dj-espanol/" target="_blank" rel="noopener">aquí</a>

Our split-level Electronic Music DJ course includes your very own slot at our club night.

Our Electronic Music DJ course is suitable for complete beginners and bedroom DJs, who want to learn the right way from our superior roster of Electronic Music DJ <a href="https://mia.garnishmusicproduction.com/instructors/" target="_blank" rel="noopener noreferrer">instructors</a> in groups of no more than four. If you wish to learn to play all genres of electronic music, this Electronic Music DJ course is for you.

<strong>We do not offer our DJ classes online, anywhere. </strong>Our DJ class involves hands-on learning and interaction with equipment, which is impossible to replicate in an online environment. Online DJ classes do not provide the same level of personal attention and feedback that is achieved in our in-person class, which greatly impacts the quality of the learning experience. Learning how to DJ should be FUN – not frustrating!

Please note that our club night is not always scheduled straight after your course, so if you're coming to Miami from out of town, please bear this in mind. If you can't make our club night but wish to be in the lineup on a future date, we can make that happen.[/vc_column_text][/vc_column_inner][/vc_row_inner][vc_row_inner][vc_column_inner width="2/3"][vc_column_text css=""]101

<strong>Let's Go</strong>
<div>
<ul>
 	<li>Equipment, set up, and ready to go</li>
 	<li>Mixer essentials</li>
 	<li>Beats and bars</li>
 	<li>Intro to beat matching</li>
 	<li>The structure of electronic music</li>
</ul>
<strong>Arrangement of Electronic Music</strong>
<ul>
 	<li>Pitch and identifying dissonance (known as clashing)</li>
 	<li>Where to mix in and mix out</li>
 	<li>Differences you need to know between Trap/Bass and 'Four-On-The-Floor'</li>
</ul>
<strong>Building a Set</strong>
<ul>
 	<li>Tips on track choice</li>
 	<li>Tempo</li>
 	<li>Set order</li>
 	<li>Mix points</li>
 	<li>Teaser mixes</li>
</ul>
<strong>FX</strong>
<ul>
 	<li>Introduction to common FX</li>
 	<li>EQ</li>
 	<li>All about filtering</li>
 	<li>FX in the mix dos and don'ts</li>
</ul>
<strong>Hardware &amp; Software</strong>
<ul>
 	<li>Pioneer Nexus</li>
 	<li>Rekordbox</li>
 	<li><a href="https://www.mixedinkey.com/" target="_blank" rel="noopener noreferrer">Mixed In Key</a></li>
</ul>
201

<strong>Your Set</strong>
<ul>
 	<li>Fine tuning your set</li>
 	<li>Mixing acapellas</li>
 	<li>Reading a crowd and having a 'plan b'</li>
</ul>
<strong>Advanced Mixing &amp; Digital Tricks</strong>
<ul>
 	<li>Sampling and triggering</li>
 	<li>All about delay and reverb in the mix</li>
 	<li>Looping and making your own mash-ups on the fly</li>
 	<li>Impact mixing with levels and FX</li>
 	<li>Body language behind the decks</li>
</ul>
<strong>Advanced Set Building &amp; Ad-libbing</strong>
<ul>
 	<li>Out-of-the-box song choice</li>
 	<li>Tempo change tips</li>
 	<li>Music programming</li>
</ul>
<b>Preparing</b><strong> for Your Show</strong>
<ul>
 	<li>Recording your set for submission</li>
 	<li>Marketing and promoting your gig</li>
</ul>
<strong>After Your Show</strong>
<ul>
 	<li>How to keep the momentum going and get more gigs</li>
 	<li>EPK tips</li>
 	<li>Developing your sound</li>
</ul>
</div>
<p style="text-align: center;"><a href="https://mia.garnishmusicproduction.com/product/electronic-music-dj-course/" target="_blank" rel="noopener noreferrer"><img class="aligncenter wp-image-10439 size-medium" src="/api/media/file/See-Schedule-300x114-1.gif" alt="" width="300" height="114" /></a>To be in the loop when we release more dates, sign up to our newsletter towards the top right of this page. We don't send many, you can easily unsubscribe, and we never share our data with anyone, ever.</p>
[/vc_column_text][/vc_column_inner][vc_column_inner width="1/3"][vc_empty_space height="128px"][vc_video link="https://youtube.com/shorts/k0114kRyvpo?si=xwNmCmU9z3Ia6Di9" el_aspect="916" css=""][/vc_column_inner][/vc_row_inner][vc_empty_space][/vc_column][vc_column][/vc_column][/vc_row]`;

async function main() {
  const payload = await getPayload({ config });

  // Get mia site
  const sites = await payload.find({
    collection: "sites",
    where: { slug: { equals: "mia" } },
    depth: 0,
  });
  const miaSiteId = sites.docs[0].id;

  const courseRes = await payload.find({
    collection: "pages",
    where: { and: [{ slug: { equals: "courses/electronic-dj-course" } }, { site: { equals: miaSiteId } }] },
    depth: 0,
  });
  
  const courseId = courseRes.docs[0].id;

  await payload.update({
    collection: "pages",
    id: courseId,
    data: { wpRawContent: originalContent },
  });

  console.log("Restored original course content");
  process.exit(0);
}

main().catch(console.error);
